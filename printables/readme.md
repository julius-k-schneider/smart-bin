# Smart Bin - 3D printed parts

All STL files for the bin housing, the sorting mechanism and the sensor/servo
mounts. Dimensions below are the actual bounding boxes of the STL files, so you
can check them against your printer before slicing.

## Part list

| File | Size (X × Y × Z, mm) | Qty | What it is |
|---|---|---|---|
| `bin.stl` | 186 × 186 × 186 | 2 | The waste container itself - one per category (Paper, Plastic) |
| `middle.stl` | 93 × 186 × 186 | 1 | Middle section between the two bins |
| `lid_bin.stl` | 176 × 176 × 8.2 | 2 | Lid for `bin.stl`, holds the fill-level sensor looking down |
| `lid_middle.stl` | 83 × 176 × 3.5 | 1 | Lid for the middle section |
| `door_blade.stl` | 60 × 67.1 × 2 | 2 | Flap that opens the way into one bin, driven by a servo |
| `ring_gear.stl` | 136.2 × 136.2 × 3.8 | 1 | Ring gear of the flap drive |
| `pinion.stl` | 40.1 × 39.9 × 2.6 | 1 | Pinion on the servo horn, drives the ring gear |
| `servo_holder.stl` | 38.2 × 38.2 × 15 | 2 | Mount for the SG90 / SG92R servos |
| `distance_sensor_holder.stl` | 50 × 30 × 29 | 3 | Mount for an HC-SR04 |
| `holding_plate.stl` | 63 × 45 × 2.5 | 1 | Mounting plate for the electronics |

The quantities follow the wiring in [`../pi/readme.md`](../pi/readme.md): two
servos and two flaps (one per category), three HC-SR04 (one trigger sensor at
the front, one in each bin lid). Print a single bin and one lid if you only
want to test one category.

## Build volume

`bin.stl` and `middle.stl` are **186 mm tall**, so you need a printer with at
least ~190 mm in Z (an Ender 3 or Prusa MK-series is fine, a Prusa Mini at
180 mm is not). Everything else fits on any common bed.

## Suggested print settings

These are starting values, not measured project settings - adjust them to your
printer and filament.

| | Structural parts (`bin`, `middle`, lids, `holding_plate`) | Gears (`ring_gear`, `pinion`) | Mounts (`servo_holder`, `distance_sensor_holder`, `door_blade`) |
|---|---|---|---|
| Material | PLA or PETG | PETG (less wear) | PLA or PETG |
| Layer height | 0.2 mm | 0.15 mm | 0.2 mm |
| Infill | 15 % | 30-40 % | 25 % |
| Perimeters | 3 | 4 | 3 |
| Supports | only for overhangs in the lids | no | no |

Notes:

- Print the gears with a **finer layer height** - tooth flanks that are too
  coarse make the flap drive jam.
- `door_blade.stl` is only 2 mm thick and slides. Print it flat, and if it is
  tight in the ring gear, sand the edge instead of scaling the part.
- If the servo does not sit tight in `servo_holder.stl`, your printer is likely
  printing slightly small - check the horizontal expansion / XY compensation
  setting rather than editing the STL.

Wiring, GPIO pins and calibration are documented in
[`../pi/readme.md`](../pi/readme.md), the electronics you need to buy are listed
in the [main README](../README.md).
