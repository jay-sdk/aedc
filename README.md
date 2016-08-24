### aedc

## Faction Mapping Project

This code provides visualizations of multi-systems factions in Elite:Dangerous, given a list of systems with coordinates, as well as population size; mixed with more frequently updating influence and state data. This code does not handle the retrieval of this data and uses sample files.

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

### data files
The system list and population is driven off of wt_map.csv, containing system name, coordinates (only x and z are used) and population (additional info included in this file is not used).

The influence and state data is driven from tracker_data.json

### embedding

Currently, the map is simply appended to the body. However, it is trivial to change this to a particular named `<div> tag in the HTML, by replacing `var svg = d3.select("body").append("svg")` with `var canvas = d3.select("#chart").append("svg:svg")` where #chart refers to the ID of the div tag.
    
    
