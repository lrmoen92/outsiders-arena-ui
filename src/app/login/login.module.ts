import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { LoginComponent } from './login.component';
import { ArenaComponent } from './arena/arena.component';
import { AppRoutingModule } from '../app-routing.module';
import { MissionComponent } from './mission/mission.component';
import { CharacterComponent } from './character/character.component';
import { RouterModule } from '@angular/router';
import { LoginService } from './login.service';


@NgModule({
  declarations: [
    LoginComponent,
    ArenaComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  providers: [

  ],
  bootstrap: [
    LoginComponent
  ]
})
export class LoginModule { }
