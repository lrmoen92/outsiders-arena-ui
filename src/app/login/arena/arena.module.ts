import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { CountdownModule } from 'ngx-countdown';
import { ArenaComponent } from './arena.component';


@NgModule({
  declarations: [
    ArenaComponent
  ],
  imports: [
    BrowserModule,
    CountdownModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [ArenaComponent]
})
export class ArenaModule { }
