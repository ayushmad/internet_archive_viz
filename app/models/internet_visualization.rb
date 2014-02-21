class InternetViz
    def self.get_json_for_congressional_data(dataset_name,
                                             model,
                                             data_format)
        if dataset_name == "congressional"
            CongressionalDataSet.get_json(model, data_format);
        end
    end
end
