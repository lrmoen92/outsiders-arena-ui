import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { BattleComponent } from './battle.component';
import { ArenaComponent } from './arena/arena.component';

@NgModule({
  declarations: [
    BattleComponent,
    ArenaComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [BattleComponent]
})
export class BattleModule { }
