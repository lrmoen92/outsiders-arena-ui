import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {MatTooltipModule} from '@angular/material/tooltip';


import { CountdownModule } from 'ngx-countdown';

import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule, Routes } from '@angular/router';
import { PortraitPipe } from './utils/portrait.pipe';
import { AbilityPipe } from './utils/ability.pipe';
import { ArenaComponent } from './arena/arena.component';
import { CharacterComponent } from './character/character.component';
import { HomeComponent } from './home/home.component';
import { MissionComponent } from './mission/mission.component';
import { NavComponent } from './nav/nav.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'arena', component: ArenaComponent },
  { path: 'mission', component: MissionComponent },
  { path: 'character', component: CharacterComponent }
  // { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AppComponent,
    ArenaComponent,
    NavComponent,
    CharacterComponent,
    HomeComponent,
    MissionComponent,
    PortraitPipe,
    AbilityPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    CountdownModule,
    ReactiveFormsModule,
    DragDropModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    FontAwesomeModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
  ],
  bootstrap: [
    AppComponent
  ],
  exports: [RouterModule]
})
export class AppModule { }
