Internet Archive Visualization
==============================
Project to create temporal visualization web graph.

Website
=======
[Internet Archive][ia_link]
[ia_link]: http://ascjanng.asc.usc.edu/

Available visualizations are listed on the top panel, 
on the right panel we can select data view available.

Each Visualizations accepts only data sources with 
particular format.
Each Data view provides a particular set of formats.


# Visualizations
## ColouredMap

The visualization can be used to display data over a map.

Data Format accepted :- Map Data

Example :- Currently when applied on domain name distribution allows, 
	   for seeing the distribution of the data over world map.


## Basic Tree Map

The visualization is used to see hierarchical data in format of Treemap.

Data Format :- hierarchical

Example :- Currently when applied on node in-degree view allows for 
	   seeing the top 10 links each based on each time_period.


## TilFord Tree

The visualization is used to see hierarchical data in tilford tree format.
This tilford allows for clarity in the url names.

Data Format :- hierarchical

Example :- Currently when applied on node in-degree view allows for 
	   seeing the top 10 links each based on each time_period.

## Forced Atlas

The visualization displays multiple graphs one for each time period.
The graphs are drawn using forced atlas.

Data Format :-  MultiGraph

Example :- Currently when applied on using node neighbours over time.

## Merged Atlas

The visualization displays multiple graphs all the graphs are drawn
in an overlap and time periods are encoded using legend.

Data Format :-  MultiGraph

Example :- Currently when applied on using node neighbours over time.

## BarPlot

The visualization displays barplot data. It also allows to filter the data 
based on legend. It also allows to flip dimensions.

Data Format :- Plot

Example :- Currently when applied on Domain name distribution we can see
	   country count on each year.

## ScatterPlot

The visualization displays barplot data. It also allows to filter the data 
based on legend. It also allows to flip dimensions.

Data Format :- Plot

Example :- Currently when applied on Domain name distribution we can see
	   country count on each year.

## FlipBoard 

This visualization displays multiple graphs all the graphs are drawn overlapping
and we can change edges for each time period.

Data Format :-  MultiGraph

Example :- Currently when applied on using node neighbours over time.

Node Movie

This visualization displays a multi graph changing over multiple time steps.

Data Format :-  MultiGraph

Example :- Currently when applied on using node neighbours over time.


# Data Views


## Node In-Degree

Data Format Supported :- Hierarchical

The data represents the distribution of different URLS about 
each URLS in degree.

## Node Out-Degree

Data Format Supported :- Hierarchical

The data represents the distribution of different URLS about 
each URLS out degree.

## Domain Name Distribution

Data Format Supported :- Map Data, Plot

The data represents the distribution of URLS based on
domain.

## Node Neighbours Over Time

Data Format Supported :- Multi Graph

The data represents neighbourhood graph of the data.
We allow filters like different domains.

## Domain Graphs Over Time

Data Format Supported :- Multi Graph

The data represents the graph inside a specific domain.

## Domain Graphs With Hop

Data Format Supported :- Multi Graph

The Domain graphs shows that the graphs inside a domain 
is generally weakly connected. The data allows one hop
node between domain graphs. This visualization validates
the view of one node per graph

## Paths Between Nodes

Data Format Supported :- Multi Graph

The structure shows different nodes in path between two nodes.

Mantis
======

[Mantis](app/assets/javascripts/Mantis/Mantis.md) is a JavaScript library developed as a part of the project.
It allows visualization to be created in isolation of Data being represented by server.
The each visualization supports a particular data format and as long as the server 
adheres to the format the JavaScript framework allows the data to be displayed.
For More description please visit [here](app/assets/javascripts/Mantis/Mantis.md).


DataBase Design
===============

# CongressNodes

| NODE URL | YEAR | NODE In-Degree | NODE OUT-Degree | NODE TLD | NODE IP MAP |
|----------|------|----------------|-----------------|----------|-------------|
|Node hostname | timestamp of the node | Number Of Edges Coming In | Number of Edges Going Out | Node Top Level Domain| Node Ip Map |

# Congress Edges

| SRC ID | Dest ID | Weight |
|--------|---------|--------|
| source node id | destination node id | weight |

# CongressTLDAggregate

| NODE TLD | Year | Number of Edges |
|----------|------|-----------------|
| top level domain | timestamp | number of edges |

