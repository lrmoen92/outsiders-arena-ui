import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { NavComponent } from './nav.component';

@NgModule({
  declarations: [
    NavComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [NavComponent]
})
export class AppModule { }
