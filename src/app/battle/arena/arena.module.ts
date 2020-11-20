import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {MatTooltipModule} from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { CountdownComponent, CountdownModule } from 'ngx-countdown';
import { ArenaComponent } from './arena.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    ArenaComponent,
    CountdownComponent
  ],
  imports: [
    BrowserModule,
    CountdownModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatTooltipModule,
    FontAwesomeModule
  ],
  providers: [
  ],
  bootstrap: [ArenaComponent]
})
export class ArenaModule { }
