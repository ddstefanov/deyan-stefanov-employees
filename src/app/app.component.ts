import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent implements OnInit {
  initialFileData: any = [];
  fileData: any = [];
  maxTogetherWorkOnProject = {
    maxDuration: 0,
    who: [],
    processed: false
  }


  ngOnInit() {
  }

  onFileChanged(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (fRevt) => {
      const strFileData = fRevt.target.result.toString()

      this.fileData = this.formatData(strFileData);
      if (this.checkDataValidity(this.fileData)) {
        this.groupEmployersByDuration();
        this.logResultInConsole()
      }
    };
    reader.readAsText(file);
  }

  formatData(strFileData: string): string[][] {
    const splitByRow = strFileData.split(/\r?\n/);
    const splitByField = splitByRow.map(row => row.toString().split(","));
    const trimmed = splitByField.map(r => r.map(r => r.trim()));
    const removeEmptyRows = trimmed.filter(r => r.length !== 1 && r[0])

    if (removeEmptyRows[0].length === 4 &&
      removeEmptyRows[0][0] === "EmpID" &&
      removeEmptyRows[0][1] === "ProjectID" &&
      removeEmptyRows[0][2] === "DateFrom" &&
      removeEmptyRows[0][3] === "DateTo"
    )
      removeEmptyRows.shift()

    this.initialFileData = JSON.parse(JSON.stringify(removeEmptyRows));

    for (let row of removeEmptyRows) {
      if (row[3] === "null" || row[3] === "NULL")
        row[3] = (new Date()).toDateString();
    }

    return removeEmptyRows
  }

  checkDataValidity(formattedData: string[][]) {
    const invalidDatefrom = formattedData.find(rd => (new Date(rd[2])).toString() === "Invalid Date");

    if (invalidDatefrom) {
      alert(`Датата ${invalidDatefrom[2]} не е валидна дата.`);
      return false
    }
    const invalidDateТо = formattedData.find(rd => (new Date(rd[3])).toString() === "Invalid Date")
    if (invalidDateТо) {
      alert(`Стойностите в колоната DateTo могат да бъдат само валидна дата или NULL.
       Стойността ${invalidDatefrom[3]} не отговаря на тези изисквания.`)
      return false
    }
    if (formattedData.some(rd => rd.length != 4)) {
      alert("Всеки ред от файла трябва да има 4 стойности във формат 'EmpID, ProjectID, DateFrom, DateTo'.")
    }
    return true
  }
  groupEmployersByDuration(): void {

    const projectsWithEmlpoyeeAndPeriods = {}

    for (const periodForEmpl of this.fileData) {
      const [employee, project, dateFrom, dateTo] = periodForEmpl;
      projectsWithEmlpoyeeAndPeriods[project] = projectsWithEmlpoyeeAndPeriods[project] || {};
      projectsWithEmlpoyeeAndPeriods[project][employee] = projectsWithEmlpoyeeAndPeriods[project][employee] || [];
      projectsWithEmlpoyeeAndPeriods[project][employee].push([new Date(dateFrom), new Date(dateTo)])
    }


    for (const proj of Object.keys(projectsWithEmlpoyeeAndPeriods)) {
      const processedCouples = [];
      for (const empl of Object.keys(projectsWithEmlpoyeeAndPeriods[proj])) {
        for (const coleaugueInProject of Object.keys(projectsWithEmlpoyeeAndPeriods[proj]).filter(c => c != empl)) {
          if (processedCouples.some(couple => couple.includes(empl) && couple.includes(coleaugueInProject)))
            continue
          processedCouples.push([empl, coleaugueInProject]);
          const timeTogether = this.getTimeTogether(projectsWithEmlpoyeeAndPeriods[proj][empl], projectsWithEmlpoyeeAndPeriods[proj][coleaugueInProject]);
          if (timeTogether > 0 && timeTogether > this.maxTogetherWorkOnProject.maxDuration) {
            this.maxTogetherWorkOnProject.maxDuration = timeTogether;
            this.maxTogetherWorkOnProject.who = [
              {
                empID_1: empl,
                empID_2: coleaugueInProject,
                projectID: proj
              }
            ]
          } else if (timeTogether > 0 && timeTogether === this.maxTogetherWorkOnProject.maxDuration) {
            this.maxTogetherWorkOnProject.who.push({
              empID_1: empl,
              empID_2: coleaugueInProject,
              projectID: proj
            })
          }
        }
      }
    }
    this.maxTogetherWorkOnProject.processed = true;
  }
  getTimeTogether(emplProjectPeriods: Array<any>, colegueProjectPeriods: Array<any>) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    let togetherDaysInProject = 0;
    for (const emplPrd of emplProjectPeriods) {
      for (const coleguePrd of colegueProjectPeriods) {
        const prdStart = new Date(Math.max(emplPrd[0].getTime(), coleguePrd[0].getTime()));
        const prdEnd = new Date(Math.min(emplPrd[1].getTime(), coleguePrd[1].getTime()));
        togetherDaysInProject = togetherDaysInProject + Math.max((prdEnd.getTime() - prdStart.getTime()) / _MS_PER_DAY, 0);
      }
    }
    return Math.round(togetherDaysInProject)
  }

  logResultInConsole() {
    if (this.maxTogetherWorkOnProject.maxDuration > 0 && this.maxTogetherWorkOnProject.who.length > 0) {
      console.log("Employee ID #1", " ", "Employee ID #2", " ", "Project ID", " ", "Days worked");
      console.log("");
      for (const couple of this.maxTogetherWorkOnProject.who)
        console.log(couple.empID_1, " ", couple.empID_2, " ", couple.projectID, " ", this.maxTogetherWorkOnProject.maxDuration)
    }
  }
}

