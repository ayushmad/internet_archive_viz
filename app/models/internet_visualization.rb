class InternetVisualization
    def self.get_json_response(dataset_name,
                               model,
                               data_format,
                               sub_filters)
        CongressionalDataSet.get_json(model, data_format, sub_filters);
    end
end
