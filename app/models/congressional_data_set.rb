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

    def self.aggregated_domian_by_country_bar_chart
        aggregated_hash = {};
        aggregated_hash["banner"] = "Countries over a period of time";
        year_list = [];
        for year in YEARS
            result_hash = node_count_by_domain(year);
            if result_hash.has_key?("UNKNOWN")
                result_hash.delete("UNKNOWN");
            end
            year_list.append({:bar_data => result_hash,
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
                    node_id_map[entry[2]] = other_node
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
                    node_id_map[entry[2]] = other_node
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
            node_id_map[exception_list[index]] = 1
            edges.each { |edge_entry|
                if edge_entry["src_id"] == exception_list[index] or edge_entry["dest_id"] == exception_list[index]
                    next;
                else
                    edge_map[index]["edges"].append({'src' => node_id_map[edge_entry["src_id"]],
                                                     'dest' => node_id_map[edge_entry["dest_id"]],
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

    def self.multi_view_graph(search_node)
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
                edge_map[year] = get_neighbours(node_map[year]);
            end
        end
        merge_create_multi_view_graph(search_node, edge_map, node_id_list);
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
                                                                }]
                                                    }
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
            if data_format == "graph_list" and sub_filters.has_key?(:node_name)
                search_node = sub_filters[:node_name];
                multi_view_graph(search_node);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        else
            raise "Unknown model"
        end
    end
end
