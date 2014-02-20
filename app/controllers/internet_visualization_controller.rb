class InternetVisualizationController < ApplicationController
    def index
        @data_set = {"congressional_dataset" => "CongressionalDataset"}
    end
    def viz_interface
        if params.has_key?(:model) and params.has_key?(:data_fromat)

        else
            render "viz_page"
        end
    end
end
