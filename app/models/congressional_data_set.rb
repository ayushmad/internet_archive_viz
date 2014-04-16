require 'json'

class CongressionalDataSet
    YEARS = ['109', '110', '111', '112'];
    WORLD_MAP = "public/world_map.json"
    COUNTRY_2_ABBR = "public/cctld_list.dat"
    

    ######################################################################
    ###################Select Node wop Map Features#######################
    ######################################################################
    
    def self.world_map_features
        map_data_str = File.open(WORLD_MAP, "r").read;
        JSON.parse map_data_str;
    end

    def self.country_2_abbriviation(country)
        unless defined? @@abbr_map
            #Loading abbr file
            @@abbr_map = {}
            File.readlines(COUNTRY_2_ABBR).each do |line|
                entry = line.split("=");
                @@abbr_map[entry[1].strip] = entry[0].strip;

            end
        end
        if @@abbr_map.has_key?(country)
            @@abbr_map[country]
        else
            ""
        end
    end
    
    def self.node_count_by_domain(year)
        urls_per_country = CongressTldAggregate.where(:year => year.to_s());
        aggregated_hash = {};
        urls_per_country.each do |country, value|
            #country_abbr = country_2_abbriviation country;
            aggregated_hash[country.node_tld] = country.count;
        end
        aggregated_hash;
    end

    def self.aggregated_domain_by_country_map(year)
        aggregated_hash = {};
        aggregated_hash["map"] = world_map_features;
        aggregated_hash["color_scheme"] = node_count_by_domain(year);
        aggregated_hash;
    end

    def self.prune_result_hash_logrithmic_scale(result_hash)
        pruned_hash = {};
        result_hash.each do |domain, val|
            log_value = Math.log2(val).to_i();
            if log_value > 1
                pruned_hash[domain] = log_value;
            end
        end
        pruned_hash;
    end

    def self.aggregated_domian_by_country_bar_chart
        aggregated_hash = {};
        aggregated_hash["banner"] = "Countries over a period of time";
        year_list = [];
        for year in YEARS
            result_hash = node_count_by_domain(year);
            if result_hash.has_key?("UNKNOWN")
                result_hash.delete("UNKNOWN");
            end
            pruned_hash = prune_result_hash_logrithmic_scale(result_hash)
            if pruned_hash.empty?
                next;
            end
            year_list.append({:bar_data => pruned_hash,
                              :property => year});
        end
        aggregated_hash["content"] = year_list;
        aggregated_hash;
    end
    
    ######################################################################
    ##################Select top k Indegree Nodes########################
    ######################################################################
    def self.nodes_by_degree(year, degree_type, start, stop)
        if degree_type == "in"
            if Rails.env != "production"
                CongressNode.where(:year => year).order(:node_indegree => :desc).offset(start).limit(stop - start);
            else
                sql = 'SELECT  "congress_nodes".* FROM "congress_nodes"  WHERE "congress_nodes"."year" = '
                sql += (year.to_s() + ' ORDER BY node_indegree DESC LIMIT ' + (stop - start).to_s());
                sql += (' OFFSET ' + start.to_s());
                result = ActiveRecord::Base.connection.execute(sql);
		result;
            end
        elsif degree_type == "out"
            if Rails.env != "production"
                CongressNode.where(:year => year).order(:node_outdegree => :desc).offset(start).limit(stop - start);
            else
                sql = 'SELECT  "congress_nodes".* FROM "congress_nodes"  WHERE "congress_nodes"."year" = '
                sql += (year.to_s() + ' ORDER BY node_outdegree DESC LIMIT ' + (stop - start).to_s());
                sql += (' OFFSET ' + start.to_s());
                result = ActiveRecord::Base.connection.execute(sql);
		result;
            end
        else
            raise "Not a valid degree type";
        end
    end
    
    def self.get_node_by_degree_year(year, degree_type, start, stop)
        nodes = nodes_by_degree(year, degree_type, start, stop); 
        aggregated_list = [];
        for node in nodes
            entry = {};
            entry["name"] = node["node_url"];
            entry["link"] = node["node_url"];
            if degree_type == "in"
                entry["value"] = node["node_indegree"];
            else
                entry["value"] = node["node_outdegree"];
            end
            aggregated_list.append(entry);
        end
        aggregated_list;
    end
    def self.node_in_degree_hierarchical
        aggregated_list = [];
        for year in YEARS
            entry = {};
            #year_value = year + "th Congrees";
            year_value = year;
            entry["name"] = year_value; 
            entry["children"] = get_node_by_degree_year(year, "in", 0, 10);
            aggregated_list.append(entry);
        end
        aggregated_hash = {};
        aggregated_hash["name"] = "Congressional Data In Degree";
        aggregated_hash["children"] = aggregated_list;
        aggregated_hash;
    end
    
    def self.node_out_degree_hierarchical
        aggregated_list = [];
        for year in YEARS
            entry = {};
            year_value = year + "th Congrees";
            entry["name"] = year_value; 
            entry["children"] = get_node_by_degree_year(year,"out", 0, 50);
            aggregated_list.append(entry);
        end
        aggregated_hash = {};
        aggregated_hash["name"] = "Congressional Data out Degree";
        aggregated_hash["children"] = aggregated_list;
        aggregated_hash;
    end

    ####################################################
    ########## Multi View Graph ########################
    ####################################################
    def self.get_neighbours(node_id)
        result = CongressEdge.where(:src_id => node_id);
        src_list = [];
        result.each { |entry|
           to_node = entry['dest_id'];
           if to_node == node_id
               next;
           end
           weight = entry['weight'];
           node_url = CongressNode.find(to_node)['node_url'];
           src_list.append([node_url, weight, to_node]);
        }
        result = CongressEdge.where(:dest_id => node_id);
        dest_list = [];
        result.each { |entry|
           from_node = entry['src_id'];
           if from_node == node_id
               next;
           end
           weight = entry['weight'];
           node_url = CongressNode.find(from_node)['node_url'];
           dest_list.append([node_url, weight, from_node]);
        }
        {"src" => src_list, "dest" => dest_list}; 
    end

    def self.get_neighbours_faster(node_id, domain_filter)
        #FIXME:- Cleanup to a better join
        src_list = [];
        dest_list = [];
        sql_query_source = "select * FROM congress_edges LEFT JOIN congress_nodes on congress_nodes.id = congress_edges.dest_id where congress_edges.src_id = " + node_id.to_s();
        result = ActiveRecord::Base.connection.execute(sql_query_source);
        result.each { |entry|
           to_node = entry['dest_id'];
           if to_node == node_id or to_node.blank?
               next;
           end
           if not domain_filter.nil? and entry["domain"].chomp == domain_filter
               next;
           end
           src_list.append([entry['node_url'], entry['weight'], to_node]);
        }
        sql_query_dest = "select * FROM congress_edges LEFT JOIN congress_nodes on congress_nodes.id = congress_edges.src_id where congress_edges.dest_id = " + node_id.to_s();
        result = ActiveRecord::Base.connection.execute(sql_query_dest);
        result.each { |entry|
           from_node = entry['src_id'];
           if from_node == node_id or from_node.blank?
               next;
           end
           if not domain_filter.nil? and entry["domain"].chomp == domain_filter
               next;
           end
           dest_list.append([entry['node_url'], entry['weight'], from_node]);
        }
        {"src" => src_list, "dest" => dest_list}
    end

    def self.get_edges_inside_neighbourhood(neighbour_nodes)
        CongressEdge.where(:src_id => neighbour_nodes, :dest_id => neighbour_nodes);
    end

    def self.merge_create_multi_view_graph(base_node, edge_named_map, exception_list)
        node_map = {};
        node_map[base_node] = 1;
        node_count = 2;
        edge_map = [];
        special_var = 0;
        node_id_map = {};
        for year in YEARS
            if not edge_named_map.has_key?(year)
                next;
            end
            year_edge_named_map = edge_named_map[year];
            edge_table = [];
            year_edge_named_map["src"].each { |entry|
                if not node_map.has_key?(entry[0])
                    node_map[entry[0]] = node_count;
                    other_node = node_count;
                    node_count += 1;
                else
                    other_node = node_map[entry[0]];
                end
                if not node_id_map.has_key?(entry[2])
                    node_id_map[entry[2]] = other_node;
                end
                edge_table.append({'src' => 1,
                                   'dest' => other_node,
                                   'weight' => entry[1]});
            }
            year_edge_named_map["dest"].each { |entry|
                if not node_map.has_key?(entry[0])
                    node_map[entry[0]] = node_count;
                    node_id_map[entry[2]] = node_count;
                    other_node = node_count;
                    node_count += 1;
                else
                    other_node = node_map[entry[0]];
                end
                if not node_id_map.has_key?(entry[2])
                    node_id_map[entry[2]] = other_node;
                end
                edge_table.append({'src' => other_node,
                                   'dest' => 1,
                                   'weight' => entry[1]});
            }
            edge_map.append({"property" => year, 
                             "edges" => edge_table});
        end
        index = 0;
        for year in YEARS
            if not edge_named_map.has_key?(year)
                next;
            end
            year_edge_named_map = edge_named_map[year];
            year_nodes = year_edge_named_map["src"].map {|entry| entry[2]} + year_edge_named_map["dest"].map {|entry| entry[2]};
            edges = get_edges_inside_neighbourhood(year_nodes);
            node_id_map[exception_list[index]] = 1;
            edges.each { |edge_entry|
                if edge_entry["src_id"] == exception_list[index] or edge_entry["dest_id"] == exception_list[index]
                    next;
                elsif !node_id_map.has_key?(edge_entry["src_id"].to_s())
                    next;
                elsif !node_id_map.has_key?(edge_entry["dest_id"].to_s())
                    next;
                else
                    edge_map[index]["edges"].append({'src' => node_id_map[edge_entry["src_id"].to_s()],
                                                     'dest' => node_id_map[edge_entry["dest_id"].to_s()],
                                                     'weight' => edge_entry["weight"]});
                end

            }
            index += 1;
        end

        special_var  = edge_map.length;
        nodes = [];
        node_map.each do |node_name, id|
            if id == 1
                nodes.append({"name" => node_name,
                              "id" => id,
                              "color" => special_var});
                special_var += 1;
            else
                nodes.append({"name" => node_name,
                              "id" => id});
            end
        end
        {"nodes" => nodes,
         "graphs" => edge_map};
    end

    def self.multi_view_graph(search_node, domain_filter)
        node_map = {};
        node_id_list = [];
        for year in YEARS
            result = CongressNode.where(:year => year, :node_url => search_node);
            node_count = 0;
            for entry in result
                if node_count > 0
                    raise "Exception multiple nodes with same name"
                end
                node_map[year] = entry['id'];
                node_id_list.append(entry['id']);
            end
        end
        edge_map = {};
        for year in YEARS
            if node_map.has_key?(year)
                edge_map[year] = get_neighbours_faster(node_map[year], domain_filter);
            end
        end
        merge_create_multi_view_graph(search_node, edge_map, node_id_list);
    end

    #####################################################
    ################Domain Graphs########################
    #####################################################
    def self.prune_edges_to_first_level(edges_record)
        edges_hash = {};
        year_hashed_nodes = {};
        for edge in edges_record
            src_node = edge["src_node_url"].chomp.split('.').last(2).join('.');
            dest_node = edge["dest_node_url"].chomp.split('.').last(2).join('.');
            if src_node == dest_node
                next;
            end
            if not edges_hash.has_key?(src_node)
                edges_hash[src_node] = {};
            end
            if not edges_hash[src_node].has_key?(dest_node)
                edges_hash[src_node][dest_node] = {};
            end
            if not edges_hash[src_node][dest_node].has_key?(edge["src_year"])
                edges_hash[src_node][dest_node][edge["src_year"]] = 0;
            end
            edges_hash[src_node][dest_node][edge["src_year"]] += edge["edge_weight"].to_i();
            if not year_hashed_nodes.has_key?(edge["src_year"])
                year_hashed_nodes[edge["src_year"].to_s()] = [src_node, dest_node];
            else
                year_hashed_nodes[edge["src_year"].to_s()].append(src_node);
                year_hashed_nodes[edge["dest_year"].to_s()].append(dest_node);
            end
        end
        central_node = nil
        year_hashed_nodes.each do |year, node_url_list|
            if central_node.nil?
                central_node = node_url_list;
            else
                central_node = central_node & node_url_list;
            end
        end

        return edges_hash, central_node[0]
    end

    def self.get_domain_graph(domain)
        edges_record = get_edges_nodes_inside_domain(domain);
        edges_hash, central_node = prune_edges_to_first_level(edges_record);
        node_count = 1;
        node_hash = {};
        node_list = [];
        if not central_node.nil?
            node_list.append({:name => central_node, :id => node_count});
            node_hash[central_node] = node_count;
            node_count += 1;
        end
        edge_list_year = {};
        edges_hash.each do |src, dest_hash|
            src_node_id = 0;
            if not node_hash.has_key?(src)
                node_hash[src] = node_count
                src_node_id = node_count;
                node_count += 1;
                node_list.append({:name => src, :id => src_node_id});
            else
                src_node_id = node_hash[src];
            end
            dest_hash.each do |dest, edge_year_hash|
                if not node_hash.has_key?(dest)
                    node_hash[dest] = node_count
                    dest_node_id = node_count;
                    node_count += 1;
                    node_list.append({:name => dest, :id => dest_node_id});
                else
                    dest_node_id = node_hash[dest];
                end
                edge_year_hash.each do |year, weight|
                    year = year.to_s();
                    if not edge_list_year.has_key?(year)
                        edge_list_year[year] = [];
                    end
                    edge_list_year[year].append({:src => src_node_id, :dest => dest_node_id, :weight => weight});
                end
            end
        end
        edges_result_list = [];
        for year in YEARS
            year = year.to_s();
            if edge_list_year.has_key?(year)
                edges_result_list.append({:property => year, :edges => edge_list_year[year]});
            end
        end
        {"nodes" => node_list,
         "graphs" => edges_result_list};
    end

    def self.get_edges_nodes_inside_domain(domain)
        sql_query = "SELECT cn1.id as src_id, cn1.node_url as src_node_url, cn1.domain as src_node_domain,\
                     cn1.year as src_year, cn2.year as dest_year, cn2.id as dest_id, cn2.node_url as dest_node_url,\
                     cn2.domain as dest_node_domain, ce.src_id, ce.dest_id , ce.weight as edge_weight FROM congress_edges ce LEFT JOIN congress_nodes\
                     cn1 ON cn1.id=ce.src_id LEFT JOIN congress_nodes cn2 ON cn2.id=ce.dest_id where cn1.domain='#{domain}' and cn2.domain='#{domain}' and cn1.node_url != cn2.node_url"
        ActiveRecord::Base.connection.execute(sql_query)
    end
    
    #####################################################
    ################Domain One Hop Graphs################
    #####################################################

    def self.get_edges_nodes_one_hop_inside_domain(domain)
        sql_query = "SELECT cn1.id as src_id, cn1.node_url as src_node_url, cn1.domain as\
                     src_node_domain, cn1.year as src_year, cn2.year as dest_year, cn2.id as\
                     dest_id, cn2.node_url as dest_node_url, cn2.domain as dest_node_domain,\
                     ce1.src_id, ce1.dest_id , ce1.weight as source_edge_weight, ce2.weight as dest_edge_weight FROM congress_edges\
                     ce1 LEFT JOIN congress_nodes cn1 ON cn1.id=ce1.src_id LEFT JOIN congress_edges\
                     ce2 ON ce1.dest_id=ce2.src_id LEFT JOIN congress_nodes cn2 ON cn2.id=ce2.dest_id\
                     where cn1.domain='#{domain}' and cn2.domain='#{domain}' and cn1.id != cn2.id"
        ActiveRecord::Base.connection.execute(sql_query)
    end

    def self.prune_edges_to_first_level_for_one_hop(edges_record)
        edges_hash = {};
        hop_node = "HOP";
        for edge in edges_record
            src_node = edge["src_node_url"].chomp.split('.').last(2).join('.');
            dest_node = edge["dest_node_url"].chomp.split('.').last(2).join('.');
            if src_node == dest_node
                next;
            end
            if not edges_hash.has_key?(src_node)
                edges_hash[src_node] = {};
            end
            if not edges_hash[src_node].has_key?(hop_node)
                edges_hash[src_node][hop_node] = {};
            end
            if not edges_hash[src_node][hop_node].has_key?(edge["src_year"])
                edges_hash[src_node][hop_node][edge["src_year"]]  = 0
            end
            if not edges_hash.has_key?(hop_node)
                edges_hash[hop_node] = {};
            end
            if not edges_hash[src_node][hop_node].has_key?(edge["src_year"])
                edges_hash[src_node][hop_node] = {edge["src_year"] => 0};
            end
            if not edges_hash.has_key?(hop_node)
                edges_hash[hop_node] = {};
            end
            if not edges_hash[hop_node].has_key?(dest_node)
                edges_hash[hop_node][dest_node] = {};
            end
            if not edges_hash[hop_node][dest_node].has_key?(edge["src_year"])
                edges_hash[hop_node][dest_node][edge["src_year"]] = 0;
            end
            edges_hash[src_node][hop_node][edge["src_year"]] += edge["source_edge_weight"].to_i();
            edges_hash[hop_node][dest_node][edge["dest_year"]] += edge["dest_edge_weight"].to_i();
        end
        return edges_hash, hop_node
    end
    
    def self.get_domain_one_hop_graph(domain)
        edges_record = get_edges_nodes_inside_domain(domain);
        edges_hash, central_node = prune_edges_to_first_level(edges_record);
        node_count = 1;
        node_hash = {};
        node_list = [];
        node_list.append({:name => "HOP", :id => node_count});
        node_hash["HOP"] = node_count;
        node_count += 1;
        edge_list_year = {};
        edges_hash.each do |src, dest_hash|
            src_node_id = 0;
            if not node_hash.has_key?(src)
                node_hash[src] = node_count
                src_node_id = node_count;
                node_count += 1;
                node_list.append({:name => src, :id => src_node_id});
            else
                src_node_id = node_hash[src];
            end
            dest_hash.each do |dest, edge_year_hash|
                if not node_hash.has_key?(dest)
                    node_hash[dest] = node_count
                    dest_node_id = node_count;
                    node_count += 1;
                    node_list.append({:name => dest, :id => dest_node_id});
                else
                    dest_node_id = node_hash[dest];
                end
                edge_year_hash.each do |year, weight|
                    year = year.to_s();
                    if not edge_list_year.has_key?(year)
                        edge_list_year[year] = [];
                    end
                    edge_list_year[year].append({:src => src_node_id, :dest => dest_node_id, :weight => weight});
                end
            end
        end
        edges_record = get_edges_nodes_one_hop_inside_domain(domain);
        edges_hash, central_node = prune_edges_to_first_level_for_one_hop(edges_record);
        edges_hash.each do |src, dest_hash|
            src_node_id = 0;
            if not node_hash.has_key?(src)
                node_hash[src] = node_count
                src_node_id = node_count;
                node_count += 1;
                node_list.append({:name => src, :id => src_node_id});
            else
                src_node_id = node_hash[src];
            end
            dest_hash.each do |dest, edge_year_hash|
                if not node_hash.has_key?(dest)
                    node_hash[dest] = node_count
                    dest_node_id = node_count;
                    node_count += 1;
                    node_list.append({:name => dest, :id => dest_node_id});
                else
                    dest_node_id = node_hash[dest];
                end
                edge_year_hash.each do |year, weight|
                    year = year.to_s();
                    if not edge_list_year.has_key?(year)
                        edge_list_year[year] = [];
                    end
                    edge_list_year[year].append({:src => src_node_id, :dest => dest_node_id, :weight => weight});
                end
            end
        end
        edges_result_list = [];
        for year in YEARS
            year = year.to_s();
            if edge_list_year.has_key?(year)
                edges_result_list.append({:property => year, :edges => edge_list_year[year]});
            end
        end
        # Hop is the first element in the node list hence accessing it directly
        node_list.first["color"] = node_list.length;
        {"nodes" => node_list,
         "graphs" => edges_result_list};
    end

    #####################################################
    ################Domain One Hop Paths################
    #####################################################

    def self.get_edges_nodes_one_hop_paths(start_node, dest_node)
        sql_query = "SELECT cn1.id as src_id, cn1.node_url as src_node_url, cn1.domain as\
                     src_node_domain, cn1.year as src_year, cn2.year as dest_year, cn2.id as\
                     dest_id, cn2.node_url as dest_node_url, cn2.domain as dest_node_domain,\
                     ce1.src_id, ce1.dest_id , ce1.weight as source_edge_weight,\
                     ch.node_url as hop_node_url, ce2.weight as dest_edge_weight FROM congress_edges\
                     ce1 LEFT JOIN congress_nodes cn1 ON cn1.id=ce1.src_id LEFT JOIN congress_edges\
                     ce2 ON ce1.dest_id=ce2.src_id LEFT JOIN congress_nodes cn2 ON cn2.id=ce2.dest_id\
                     LEFT JOIN congress_nodes ch ON ce1.dest_id = ch.id \
                     where cn1.node_url='#{start_node}' and cn2.node_url='#{dest_node}' and cn1.id != cn2.id"
        ActiveRecord::Base.connection.execute(sql_query)
    end

    def self.prune_edges_to_first_level_for_one_hop_paths(edges_record)
        edges_hash = {};
        for edge in edges_record
            src_node = edge["src_node_url"].chomp.split('.').last(2).join('.');
            hop_node = edge["hop_node_url"].chomp.split('.').last(2).join('.');
            dest_node = edge["dest_node_url"].chomp.split('.').last(2).join('.');
            if src_node == dest_node
                next;
            end
            if not edges_hash.has_key?(src_node)
                edges_hash[src_node] = {};
            end
            if not edges_hash[src_node].has_key?(hop_node)
                edges_hash[src_node][hop_node] = {};
            end
            if not edges_hash[src_node][hop_node].has_key?(edge["src_year"])
                edges_hash[src_node][hop_node][edge["src_year"]]  = 0
            end
            if not edges_hash.has_key?(hop_node)
                edges_hash[hop_node] = {};
            end
            if not edges_hash[src_node][hop_node].has_key?(edge["src_year"])
                edges_hash[src_node][hop_node] = {edge["src_year"] => 0};
            end
            if not edges_hash.has_key?(hop_node)
                edges_hash[hop_node] = {};
            end
            if not edges_hash[hop_node].has_key?(dest_node)
                edges_hash[hop_node][dest_node] = {};
            end
            if not edges_hash[hop_node][dest_node].has_key?(edge["src_year"])
                edges_hash[hop_node][dest_node][edge["src_year"]] = 0;
            end
            edges_hash[src_node][hop_node][edge["src_year"]] += edge["source_edge_weight"].to_i();
            edges_hash[hop_node][dest_node][edge["dest_year"]] += edge["dest_edge_weight"].to_i();
        end
        return edges_hash
    end
    
    def self.get_domain_one_hop_path(start_node, dest_node)
        edges_record = get_edges_nodes_one_hop_paths(start_node, dest_node);
        edges_hash = prune_edges_to_first_level_for_one_hop_paths(edges_record);
        node_count = 1;
        node_hash = {};
        node_list = [];
        node_list.append({:name => start_node, :id => node_count});
        node_hash[start_node] = node_count;
        node_count += 1;
        edge_list_year = {};
        edges_hash.each do |src, dest_hash|
            src_node_id = 0;
            if not node_hash.has_key?(src)
                node_hash[src] = node_count
                src_node_id = node_count;
                node_count += 1;
                node_list.append({:name => src, :id => src_node_id});
            else
                src_node_id = node_hash[src];
            end
            dest_hash.each do |dest, edge_year_hash|
                if not node_hash.has_key?(dest)
                    node_hash[dest] = node_count
                    dest_node_id = node_count;
                    node_count += 1;
                    node_list.append({:name => dest, :id => dest_node_id});
                else
                    dest_node_id = node_hash[dest];
                end
                edge_year_hash.each do |year, weight|
                    year = year.to_s();
                    if not edge_list_year.has_key?(year)
                        edge_list_year[year] = [];
                    end
                    edge_list_year[year].append({:src => src_node_id, :dest => dest_node_id, :weight => weight});
                end
            end
        end
        edges_result_list = [];
        for year in YEARS
            year = year.to_s();
            if edge_list_year.has_key?(year)
                edges_result_list.append({:property => year, :edges => edge_list_year[year]});
            end
        end
        # Hop is the first element in the node list hence accessing it directly
        node_list.first["color"] = node_list.length;
        {"nodes" => node_list,
         "graphs" => edges_result_list};
    end


    
    #####################################################
    ################Accepted Json########################
    #####################################################
    
    def self.get_json(model, data_format, sub_filters)
        if model == "model_listing"
            model_listing = {"node_in_degree" => { "endpoint" => "congressional_dataset",
                                                   "format_supported" => ["hierarchical"],
                                                   "display_name" => "Nodes In-degree"},
                             "node_out_degree" => { "endpoint" => "congressional_dataset",
                                                    "format_supported" => ["hierarchical"],
                                                    "display_name" => "Nodes Out-Degree"},
                             "aggregated_domain_by_country" => { "endpoint" => "congressional_dataset",
                                                                 "format_supported" => ["map", "bar_data"],
                                                                 "display_name" => "Domain Name Distribution",
                                                                 "sub_filter" => [ { "sub_menutype" => "dropdown",
                                                                                     "sub_menu_name" => "year",
                                                                                     "sub_menu_display_name" => "Select Year",
                                                                                     "sub_menu_options" => [{"name" => "109"}, {"name" => "110"}, {"name" => "111"}, {"name" => "112"}]
                                                                                    }]
                                                                },
                              "multi_view_graph" => { "endpoint" => "congressional_dataset",
                                                     "format_supported" => ["graph_list"],
                                                     "display_name" => "Node Neighbours Over Time",
                                                     "sub_filter" => [{ "sub_menutype" => "search_bar",
                                                                        "sub_menu_name" => "node_name",
                                                                        "sub_menu_display_name" => "Root Node"
                                                                },
                                                                { "sub_menutype" => "dropdown",
                                                                  "sub_menu_name" => "domain_filter",
                                                                  "sub_menu_display_name" => "Filter By Domain",
                                                                  "sub_menu_options" => [{"name" => "No-filter"}, {"name" => "edu"}, {"name" => "us"}, {"name" => "uk"}, {"name" => "in"}, {"name" => "gov"}]
                                                                }]
                                                    },
                              "multi_view_domain_graphs" => { "endpoint" => "congressional_dataset",
                                                              "format_supported" => ["graph_list"],
                                                              "display_name" => "Domain Graphs Over Time",
                                                               "sub_filter" => [{ "sub_menutype" => "dropdown",
                                                                                  "sub_menu_name" => "domain",
                                                                                  "sub_menu_display_name" => "Select Domain",
                                                                                  "sub_menu_options" => [{"name" => "edu"}, {"name" => "us"}, {"name" => "uk"}, {"name" => "in"}, {"name" => "gov"}]
                                                                        }]
                                                    },
                              "multi_view_one_hop_domain_graphs" => { "endpoint" => "congressional_dataset",
                                                              "format_supported" => ["graph_list"],
                                                              "display_name" => "Domain Graphs With Hop",
                                                               "sub_filter" => [{ "sub_menutype" => "dropdown",
                                                                                  "sub_menu_name" => "domain",
                                                                                  "sub_menu_display_name" => "Select Domain",
                                                                                  "sub_menu_options" => [{"name" => "edu"}, {"name" => "us"}, {"name" => "uk"}, {"name" => "in"}]
                                                                        }]
                                                    },
                              "multi_view_one_hop_path" => { "endpoint" => "congressional_dataset",
                                                             "format_supported" => ["graph_list"],
                                                             "display_name" => "Paths Between Nodes",
                                                             "sub_filter" => [{ "sub_menutype" => "search_bar",
                                                                        "sub_menu_name" => "start_node",
                                                                        "sub_menu_display_name" => "Source Node"
                                                                },
                                                                { "sub_menutype" => "search_bar",
                                                                  "sub_menu_name" => "dest_node",
                                                                  "sub_menu_display_name" => "Destination Node"
                                                                }]
                                                    },
                            }
            model_listing;
        elsif model == "node_in_degree"
            if data_format == "hierarchical"
                node_in_degree_hierarchical
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "node_out_degree"
            if data_format == "hierarchical"
                node_out_degree_hierarchical
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "aggregated_domain_by_country"
            if data_format == "map"
                year = 109
                if sub_filters.has_key?(:year)
                    year = sub_filters[:year];
                end
                aggregated_domain_by_country_map(year);
            elsif data_format == "bar_data"
                aggregated_domian_by_country_bar_chart;
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "multi_view_graph"
            if data_format == "graph_list"
                # Defaulting to house.gov
                search_node = "house.gov"
                if sub_filters.has_key?(:node_name)
                    search_node = sub_filters[:node_name];
                end
                domain_filter = sub_filters[:domain_filter];
                if domain_filter == "No-filter"
                    domain_filter = nil
                end
                multi_view_graph(search_node, domain_filter);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "multi_view_domain_graphs"
            if data_format == "graph_list"
                domain = "edu"
                if sub_filters.has_key?(:domain)
                    domain = sub_filters[:domain];
                end
                get_domain_graph(domain);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "multi_view_one_hop_domain_graphs"
            if data_format == "graph_list"
                domain = "edu"
                if sub_filters.has_key?(:domain)
                    domain = sub_filters[:domain];
                end
                get_domain_one_hop_graph(domain);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        elsif model == "multi_view_one_hop_path"
            if data_format == "graph_list"
                start_node = "house.gov"
                dest_node = "senete.gov"
                if sub_filters.has_key?(:start_node)
                    start_node = sub_filters[:start_node];
                end
                if sub_filters.has_key?(:dest_node)
                    dest_node = sub_filters[:dest_node];
                end
                get_domain_one_hop_path(start_node, dest_node);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        else
            raise "Unknown model"
        end
    end
end
