class CongressEdge < ActiveRecord::Base
   attr_accessible :src_id, :dest_id, :weight
   belongs_to :src, :class_name => "CongressNodes"
   belongs_to :dest, :class_name => "CongressNodes"
end
