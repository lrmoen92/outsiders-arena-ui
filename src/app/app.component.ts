import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
	
	title : string = 'outsiders-arena-ui';

  constructor() {
  }

  ngOnInit() {
    console.log("start")

    console.log("find")
    
  }

}
