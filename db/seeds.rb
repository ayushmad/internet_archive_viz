# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)


$file_map_base = { :node_file => 'node_file_[YEAR_MARKER].nodes',
                   :edge_file => 'node_file_[YEAR_MARKER].edges'}

#$time_steps = ['109', '110', '111', '112'];
$time_steps = ['109', '110'];

DEVELOPMENT_TABLE_COUNT = 1000;
YEAR_MARKER = '[YEAR_MARKER]';
BASE_DATA = '/home/ayushmad/Data_processing/ia-data-processing/hpcc/output_files/';
DELIMITER = ";";
$tld_table = {};

def get_file_name(base_name, year)
    return BASE_DATA + base_name.sub(YEAR_MARKER, year.to_s());
end

def add_to_tld_table(year, node_tld)
    if not $tld_table.has_key?(year)
        $tld_table[year] = {};
    end
    if not $tld_table[year].has_key?(node_tld)
        $tld_table[year][node_tld] = 0;
    end
    $tld_table[year][node_tld] += 1;
end


def populate_node_table(time_step)
    # expecting node file to be first rest will be update
    nfn = get_file_name($file_map_base[:node_file], time_step);
    nfh = File.new(nfn, 'r');
    if Rails.env == 'production'
        while line = nfh.gets();
              entry = line.split(DELIMITER);
              entry_hash = {:node_url => entry[0],
                            :year => time_step,
                            :node_indegree => entry[1],
                            :node_outdegree => entry[2],
                            :node_tld => entry[5],
                            :node_ip_map => entry[4]};

              CongressNode.create(entry_hash);
              add_to_tld_table(time_step, entry[5].strip);
        end 
    else
        counter = DEVELOPMENT_TABLE_COUNT;
        while counter > 0
            line = nfh.gets();
            entry = line.split(DELIMITER);
            entry_hash = {:node_url => entry[0],
                          :year => time_step,
                          :node_indegree => entry[1],
                          :node_outdegree => entry[2],
                          :node_tld => entry[5],
                          :node_ip_map => entry[4]};

            CongressNode.create(entry_hash);
            add_to_tld_table(time_step, entry[5].strip);
            counter -= 1;
        end
    end
end

def populate_edge_table(time_step)
    # expecting node file to be first rest will be update
    efn = get_file_name($file_map_base[:edge_file], time_step);
    efh = File.new(efn, 'r');
    if Rails.env == 'production'
        while (line = efh.gets())
        	entry = line.split(DELIMITER);
        	src_id = CongressNode.where(:node_url => entry[0]);
        	dest_id = CongressNode.where(:node_url => entry[1]);
        	entry_hash = { :src_id => src_id,
                	       :dest_id => dest_id,
                       	 :weight => entry[2]};
        	CongressEdge.create(entry_hash);
	end 
    else
        counter = DEVELOPMENT_TABLE_COUNT;
        while counter > 0
            line = efh.gets();
            entry = line.split(DELIMITER);
            src_id = CongressNode.where(:node_url => entry[0]);
            dest_id = CongressNode.where(:node_url => entry[1]);
            entry_hash = { :src_id => src_id,
                           :dest_id => dest_id,
                           :weight => entry[2]};
            CongressEdge.create(entry_hash);
            counter -= 1;
        end
    end
end

def populate_tld_table
    $tld_table.each do |year, tld_map|
        tld_map.each do |tld, value|
            entry_hash = { :node_tld => tld,
                           :year => year,
                           :count => value};
            CongressTldAggregate.create(entry_hash);
        end
    end
end


# Creating Entries Per time step

$time_steps.each do |ts|
    populate_node_table(ts.to_i());
    populate_edge_table(ts.to_i());
end
populate_tld_table()
