class SetDomainField < ActiveRecord::Migration
  def up
      years = ['109', '110', '111', '112'];
      years.each do |year|
        result_set  = CongressNode.where(:year => year);
        for entry in result_set
            domain = entry[:node_url].chomp.split('.')[-1];
            entry[:domain] = domain;
            entry.save!;
        end
      end
  end

  def down
  end
end
