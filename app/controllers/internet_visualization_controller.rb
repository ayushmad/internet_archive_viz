class InternetVisualizationController < ApplicationController
    def index
        @data_set = {"congressional_dataset" => "CongressionalDataset"}
    end
    def viz_interface
        if params.has_key?(:model) and params.has_key?(:data_fromat)
            @json_page = InternetVisualization.get_json_response(request.fullpath,
                                                                 params(:model),
                                                                 params(:data_format));
            render @json_page and return;
        else
            render "viz_page" and return;
        end
    end
end
