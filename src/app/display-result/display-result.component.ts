import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.styl']
})
export class DisplayResultComponent implements OnInit {

  @Input() longPairOnProjects: any;

  constructor() { }

  ngOnInit(): void {
  }

}
