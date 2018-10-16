#!/usr/bin/env bash

# to create a simpler json file with only metro stations of Montréal
# data originaly taken from http://donnees.ville.montreal.qc.ca/dataset/stm-traces-des-lignes-de-bus-et-de-metro
#  then converted to geojson using https://mygeodata.cloud/converter/shp-to-json
#  to produce stm_arrets_sig.geojson

# the output of this command is metroLines.json which is then "hand sorted" according to the "real" ordering of stations on each line
jq -f extractLines.jq  <stm_arrets_sig.geojson | python3 compactLines.py


