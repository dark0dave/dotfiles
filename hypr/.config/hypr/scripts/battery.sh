#!/usr/bin/env bash

set -euo pipefail

battery_percentage=$(cat /sys/class/power_supply/BAT1/capacity)
battery_icons=("" "" "" "" "")
icon_index=$((battery_percentage / 20))
echo ${battery_icons[icon_index]}

