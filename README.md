### aedc

## Faction Mapping Project

This code provides visualizations of multi-systems factions in Elite:Dangerous, given a list of systems with coordinates, population size; influence and state data. This code uses sample file, but has the code for URL-based data retrieval included (see below)

### Examples

1. Control Map: which systems does the faction in question control

![control](/screenshots/control.PNG)

2. Population Map: what is the size of the population for these systems (using a logarithmic scale)

![population](/screenshots/population_logscale.PNG)

3. Influence Map: what is the current influence for the selected faction in each system (red to green to light green) (ruling = green border, non-ruling = red)

![influence](/screenshots/influence.PNG)

4. Active States Map: shows all active states, other than None, for all factions in the system. Selected faction state will be shown in the main circle

![states](/screenshots/states.PNG)

5. Dangerspots: shows the closest margin to the next faction for the selected faction (ruling = green border, non-ruling = red)

![dangerspots](/screenshots/dangerspots.PNG)

### data file
Currently, the code uses a sample file (`tracker_data.json') but the code is supplied to handle live requests:

```//base url: update this to correct path
var t_baseURL = ""; // http://aedc.etc.
//default; update from tracker faction dropdown onChange
var selectedFaction = "Wolf 406 Transport & Co";
...
function createMap(selectedFaction){
    d3.json("tracker_data.json", function(error, mapdata) {
    //build the URL to the right faction: base URL + faction, with white spaces replaced with '+'
    //d3.json(t_baseURL + selectedFaction.replace(/ /g, "+"), function(error, mapdata) {
	...```
	
Comment the current d3.json line, and uncomment the last one here. Note that this assumes a baseURL that includes a trailing /. Faction name has whitespace escaped; replace with URLencoding if that causes problems with & chars (but it shouldn't)


### embedding

The chart is attached to a <div> tag in the HTML. There is no real dependency on the HTML file. To embed this chart into an existing HTML page, include like so:

```<div id="map" />
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="wt_map_viz2.js"></script>```

The faction selection is driven off of a select box. This should have an ID of `js_faction`. The code appends an onChange event to this to make the call to the server backend.
    
    
