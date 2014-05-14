Mantis
======

It allows visualization to be created in isolation of Data being represented by server.
The each visualization supports a particular data format and as long as the server 
adheres to the format the JavaScript framework allows the data to be displayed.

Dependency
==========
[D3.js](http://d3js.org)

[RickShaw.js](http://code.shutterstock.com/rickshaw/)


Classes
=======

# Mantis Module
Module provides basic utilities useful during developing visualization.

# Mantis Controller
Controller manages the interaction between Mantis Model and Mantis View.
Controllers maintains the structure as a system. A user of the API
creates a new system and then adds different visualization and models to the
system.

Mantis also provides a message passing which are used by different copies
to interact between them.

# Mantis Model
Models are Objects which contain the data returned by the server.
Currently they are just place holder which initiate a get request
to server.

# Mantis View
View is a abstract class which must be extend by a visualizations.
Any visualizations must extend the base class.
