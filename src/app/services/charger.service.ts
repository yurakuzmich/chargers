import { Injectable } from '@angular/core';
import { chargers_list as charges } from '../mock-data/chargers.mock';
import * as L from 'leaflet';
import { ChargerInterface } from '../models/charger.model';

@Injectable({
  providedIn: 'root'
})
export class ChargerService {

  constructor() { }

  getChargersInRadius(radius: number, location: L.LatLng): ChargerInterface[] {
    const nearbyLocations = charges.filter(charger => {
      const distance = location.distanceTo(new L.LatLng(charger.lat, charger.lng));
      return distance <= radius;
    });

    return nearbyLocations;
  }
}
