class CongressEdge < ActiveRecord::Base
   attr_accessible :src_id, :dest_id, :weight
end
