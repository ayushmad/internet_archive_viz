class CreateCongressNodes < ActiveRecord::Migration
  def up
    create_table :congress_nodes do |t|
        t.string :node_url
        t.integer :year
        t.integer :node_indegree 
        t.integer :node_outdegree
        t.string :node_tld
        t.string :node_ip_map
    end
  end

  def down
      drop_table :congress_nodes;
  end
end
