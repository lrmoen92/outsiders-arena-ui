import { Component, OnInit, } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Mission } from 'src/app/model/api-models';
import { MissionStore } from 'src/app/utils/mission.store';

@Component({
  selector: 'mission-root',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.css']
})
export class MissionComponent implements OnInit {

  allMissions : Observable<Array<Mission>>;
  missionStore : MissionStore;

	constructor(
    missionStore : MissionStore
	) {
    this.missionStore = missionStore;
  }
  
  ngOnInit() {
    this.allMissions = this.missionStore.getMissions();
  }
}
