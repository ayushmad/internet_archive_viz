class AddDomainToCongressNode < ActiveRecord::Migration
  def change
    add_column :congress_nodes, :domain, :string
  end
end
