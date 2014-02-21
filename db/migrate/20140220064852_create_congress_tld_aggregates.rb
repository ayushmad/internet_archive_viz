class CreateCongressTldAggregates < ActiveRecord::Migration
  def up
    create_table :congress_tld_aggregates do |t|
        t.string :node_tld
        t.string :year
        t.integer :count
    end
  end

  def down
      drop_table :congress_tld_aggregates;
  end
end
