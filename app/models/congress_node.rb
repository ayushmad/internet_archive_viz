class CongressNode < ActiveRecord::Base
   attr_accessible :node_url, :year, :node_indegree, :node_outdegree, :node_tld, :node_ip_map 
   validates :node_url, presence: true
   validates :year, presence: true
   validates :node_indegree, presence: true
   validates :node_outdegree, presence: true
end
