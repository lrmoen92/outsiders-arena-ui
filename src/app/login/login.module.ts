import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { LoginComponent } from './login.component';
import { ChatComponent } from './chat/chat.component';
import { ArenaComponent } from './arena/arena.component';

@NgModule({
  declarations: [
    LoginComponent,
    ArenaComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [
    LoginComponent
  ]
})
export class LoginModule { }
