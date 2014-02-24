# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20140220064852) do

  create_table "congress_edges", :force => true do |t|
    t.integer "src_id"
    t.integer "dest_id"
    t.integer "weight"
  end

  create_table "congress_nodes", :force => true do |t|
    t.string  "node_url"
    t.integer "year"
    t.integer "node_indegree"
    t.integer "node_outdegree"
    t.string  "node_tld"
    t.string  "node_ip_map"
  end

  create_table "congress_tld_aggregates", :force => true do |t|
    t.string  "node_tld"
    t.integer "year"
    t.integer "count"
  end

end
