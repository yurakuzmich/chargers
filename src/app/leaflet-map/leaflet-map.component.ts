import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { GeolocationService } from '../services/geolocation.service';
import { ChargerService } from '../services/charger.service';
import { ChargerInterface } from '../models/charger.model';

const userMarkerIcon = L.icon({
  iconUrl: 'icons/me-icon.png',
  iconSize: [41, 41],
  iconAnchor: [21, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'icons/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [10, 43]
});

const chargerIcon = L.icon({
  iconUrl: 'icons/charger.png',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [1, -34],
  // shadowUrl: 'icons/marker-shadow.png',
  // shadowSize: [-15, 45]
})

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private userMarker!: L.Marker | null;
  private locateControl!: L.Control;

  markers: L.Marker[] = [];
  latitude: number = 0;
  longitude: number = 0;
  errorMessage: string | null = null;
  currentSearchRadius: number = 0;
  chargersInRadius: ChargerInterface[] = [];

  isActivityEnabled: boolean = false;
  isWalkRadiusEnabled: boolean = false;

  tempArr: ChargerInterface[] = [];

  constructor(private geolocationService: GeolocationService, private chargerService: ChargerService) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.initMap();
    // this.getLocation();
  }

  private initMap() {
    const baseMapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map').setView([this.latitude, this.longitude], 10);
    L.tileLayer(baseMapUrl).addTo(this.map);

    this.map.locate({ setView: true, maxZoom: 16 });
    this.map.on('locationfound', (e) => this.onLocationFound(e));
    this.map.on('locationerror', () => this.onLocationFoundError());
    // this.map.on('click', (e) => this.onMapClick(e));
    this.addLocateMeControl();
  }

  // getLocation() {
  //   this.geolocationService.getCurrentPosition()
  //   .then((position) => {
  //     this.latitude = position.coords.latitude;
  //     this.longitude = position.coords.longitude;
  //   })
  //   .catch(error => {
  //     this.errorMessage = error.message;
  //   });
  // }

  onLocationFound(e:L.LocationEvent) {
    this.latitude = e.latlng.lat;
    this.longitude = e.latlng.lng;

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    this.userMarker = L.marker(e.latlng, { icon: userMarkerIcon }).addTo(this.map);

    this.fitMapToMarkers();

    // L.marker(e.latlng, {icon: userMarkerIcon})
    //   .addTo(this.map)
    //   // .bindPopup(`You are within ${e.accuracy} meters from this point`)
    //   .openPopup();
  }

  onLocationFoundError() {
    this.errorMessage = 'Unable to retrieve your location';
  }

  // onMapClick(e: L.LeafletMouseEvent) {
  //   console.log(e);
  //   this.tempArr.push({lat: e.latlng.lat, lng: e.latlng.lng, name: "", description: "", type: ""});
  //   console.log(JSON.stringify(this.tempArr));
  // }

  chargerRadiusSelect(e: any) {
    this.chargersInRadius = this.getChargersInRadius(e.target.value);
    this.addChargersInRadius(this.chargersInRadius);
    this.isActivityEnabled = true;
  }

  activitySelect(e: any) {
    this.isWalkRadiusEnabled = true;
  }

  private addLocateMeControl() {
    const LocateMeControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: (map: L.Map) => {
        const button = L.DomUtil.create('button', 'custom-control');
        button.innerHTML = '📍 Locate Me';
        button.style.padding = '5px';
        button.style.background = 'white';
        button.style.border = '1px solid gray';
        button.style.cursor = 'pointer';

        L.DomEvent.on(button, 'click', () => {
          map.locate({ setView: true, maxZoom: 16 });

          map.on('locationfound', (e: L.LocationEvent) => {
            if (this.userMarker) {
              this.map.removeLayer(this.userMarker);
            }
            this.userMarker = L.marker(e.latlng, { icon: userMarkerIcon }).addTo(this.map)
            this.fitMapToMarkers();
          });

          map.on('locationerror', () => {
            this.onLocationFoundError();
          });
        });

        return button;
      }
    });

    this.locateControl = new LocateMeControl();
    this.map.addControl(this.locateControl);
  }

  getChargersInRadius(radius: number) {
    return this.chargerService.getChargersInRadius(radius, L.latLng(this.latitude, this.longitude));
  }

  addChargersInRadius(chargers: any) {
    this.removeAllMarkers();
    chargers.forEach((charger: any) => {
      const marker = L.marker([charger.lat, charger.lng], {icon: chargerIcon}).addTo(this.map);
      this.markers.push(marker);
    });

    this.fitMapToMarkers();
  }

  fitMapToMarkers() {
    const group = L.featureGroup([...this.markers]);

    if (this.userMarker) {
      group.addLayer(this.userMarker);
    }

    if (group.getLayers().length > 0) {
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] }); // Adds padding for better view
    }
  }

  removeAllMarkers() {
    this.markers.forEach((marker) => {
      marker.remove();
    });
    this.markers = [];
  }

  closeErrorMessage() {
    this.errorMessage = null;
  }
}
