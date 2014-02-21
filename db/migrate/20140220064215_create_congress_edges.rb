class CreateCongressEdges < ActiveRecord::Migration
  def up
    create_table :congress_edges do |t|
        t.integer :src_id
        t.integer :dest_id
        t.integer :weight
    end
  end

  def down
      drop_table(:congress_edges);
  end
end
