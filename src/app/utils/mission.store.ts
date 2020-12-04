import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Character, Mission } from 'src/app/model/api-models';
import { MissionService } from './mission.service';

@Injectable(
  {providedIn:'root'}
) 
export class MissionStore {

  missionService : MissionService;

  missionsLoaded : boolean = false;

  _allMissions: BehaviorSubject<Array<Mission>> = new BehaviorSubject([]);
  allMissions: Observable<Array<Mission>> = this._allMissions.asObservable();

  constructor(missionService: MissionService) {
    this.missionService = missionService;
  }

  setMissionsLoaded(b : boolean) {
    this.missionsLoaded = b;
  }

  setMissions(missions : Array<Mission>) {
    this._allMissions.next(missions);
  }

  initMissions() {
    this.missionService.initMissions().pipe(take(1)).subscribe(
      x => {
        this.setMissions(<Array<Mission>> x);
      },
      y => {

      },
      () => {
        this.setMissionsLoaded(true);
      }
    );
  }

  getMissions() : Observable<Array<Mission>> {

    if (!this.missionsLoaded) {
      this.initMissions();
    }

    return this.allMissions;
  }
}