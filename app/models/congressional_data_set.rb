require 'json'

class CongressionalData
    YEARS = ['109', '110', '111', '112'];
    WORLD_MAP = "public/world_map.json"
    COUNTRY_2_ABBR = "public/cctld_list.dat"
    

    ######################################################################
    ###################Select Node wop Map Features#######################
    ######################################################################
    
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
        urls_per_country = CongressTldAggregate.where(:year => year);
        aggregated_hash = {};
        urls_per_country.each do |country, value|
            country_abbr = country_2_abbriviation country;
            aggregated_hash[country_abbr] = value.to_i();
        end
        aggregated_hash;
    end

    def self.aggregated_domain_by_country_map(year)
        aggregated_hash = {};
        aggregated_hash["map"] = world_map_features;
        aggregated_hash["color_scheme"] = node_count_by_domain(year);
        aggregated_hash;
    end
    
    ######################################################################
    ##################Select top k Indegree Nodes########################
    ######################################################################
    def self.nodes_by_degree(year, degree_type, start, stop)
        if degree_type == "in"
            CongressNode.where(:year => year).order(:node_indegree => :desc).offset(start).limit(stop - start);
        elsif degree_type == "out"
            CongressNode.where(:year => year).order(:node_outdegree => :desc).offset(start).limit(stop - start);
        else
            raise "Not a valid degree type";
        end
    end
    
    def self.get_node_by_degree_year(year, degree_type, start, stop)
        nodes = nodes_by_degree(year, degree_type, start, stop); 
        aggregated_list = [];
        for node in nodes
            entry = {};
            entry["name"] = node.node_url;
            entry["link"] = node.node_url;
            if degree_type == "in"
                entry["value"] = node.node_indegree;
            else
                entry["value"] = node.node_outdegree;
            end
            aggregated_list.append(entry);
        end
        aggregated_list;
    end
    def self.node_in_degree_hierarchical
        aggregated_list = [];
        for year in YEARS
            entry = {};
            year_value = year + "th Congrees";
            entry["name"] = year_value; 
            entry["children"] = get_node_by_degree_year(year, "in", 0, 50);
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

    
    #####################################################
    ################Accepted Json########################
    #####################################################
    
    def self.get_json(model, data_format)
        if model == "model_listing"
            model_listing = {"node_in_degree" => { "endpoint" => "congressional_dataset",
                                                "format_supported" => ["hierarchical"]},
                             "node_out_degree" => { "endpoint" => "congressional_dataset",
                                                "format_supported" => ["hierarchical"]},
                             "109-aggregated_domain_by_country" => { "endpoint" => "congressional_dataset",
                                                                 "format_supported" => ["map"]},
                             "110-aggregated_domain_by_country" => { "endpoint" => "congressional_dataset",
                                                                 "format_supported" => ["map"]}};
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
                year = params(:year);
                aggregated_domain_by_country_map(year);
            else
                raise "Data format not supported by model: node_in_degree"
            end
        #elsif model == "node_neighbours"
        else
            raise "Unknown model"
        end
    end
end
