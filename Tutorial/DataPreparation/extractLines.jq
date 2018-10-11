# filter by route (find all stations in a single route) and sort them by coords
#  but in the end, the stations will have to be resorted to respect the "real" order
def route($n):[ .features | .[] 
    | {id:(.properties.stop_id),station:(.properties.stop_name|sub("Station ";"")),
       route:(.properties.route_id),coords:(.geometry.coordinates)} 
    | select((.id|test("^\\d\\d?$")) and (.route|test("\($n)")))
];
[route(1),route(2),route(3),route(4),route(5)]