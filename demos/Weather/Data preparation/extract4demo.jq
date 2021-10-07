def tz:[.[0]+5,.[1]+5]+.[2:]; # shift timezone 
{
header:(["regular"]+.header[4:7]+[(.header[7]/100|floor),.header[7]%100,"next"]+.header[10:13]+[(.header[13]/100|floor),.header[13]%100]),
"names-en",
"names-fr",
climatology:.climat_temp|map(tz),
pcpn:.pcpn|map(tz),
pcpn_accum:.accum|map(tz),
pcpn_prob:.prob[0][2:]|map(tz),
sky_cover:.ciel|map(tz),
temp:.temp|map(tz),
uv_index:.indice_uv|map(tz),
wind:.vents|map(tz)
}