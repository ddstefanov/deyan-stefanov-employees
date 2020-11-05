import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent implements OnInit {
  _MS_PER_DAY: number = 1000 * 60 * 60 * 24;
  initialFileData: any = [];
  fileData: any = [];
  longestWorkInTeam: Array<any> = [];
  processed: boolean = false;

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

    if (formattedData.some(rd => rd.length != 4)) {
      alert("Всеки ред от файла трябва да има 4 стойности във формат 'EmpID, ProjectID, DateFrom, DateTo'.")
      return false
    }
    const invalidDatefrom = formattedData.find(rd => (new Date(rd[2])).toString() === "Invalid Date");

    if (invalidDatefrom) {
      alert(`Датата ${invalidDatefrom[2]} не е валидна дата.`);
      return false
    }
    const invalidDateТо = formattedData.find(rd => (new Date(rd[3])).toString() === "Invalid Date")
    if (invalidDateТо) {
      alert(`Стойностите в колоната DateTo могат да бъдат само валидна дата или NULL.
       Стойността ${invalidDateТо[3]} не отговаря на тези изисквания.`)
      return false
    }

    return true
  }

  groupEmployersByDuration(): void {
    const employeeSet = new Set();
    for (const periodForEmpl of this.fileData)
      employeeSet.add(periodForEmpl[0])

    const allEmployees = Array.from(employeeSet);

    const pairs = [];
    const projects = {};
    for (const empl of allEmployees) {
      if (!projects[empl.toString()])
        projects[empl.toString()] = this.fileData.filter(projPrd => projPrd[0] === empl);
      for (const colegue of allEmployees.filter(col => col != empl)) {
        if (pairs.some(c => c.includes(empl) && c.includes(colegue)))
          continue
        pairs.push([empl, colegue])
      }
    }

    let pairDuration: number = 0;

    for (const pair of pairs) {

      let coupleInTeams = {
        employee1: pair[0],
        employee2: pair[1],
        projects: [],
        total: 0
      }

      for (const emplprojPeriod of projects[pair[0].toString()])
        for (const clgueprojPeriod of projects[pair[1].toString()]) {
          const togetherWorkOnProject = this.checkTogetherWorkOnProject(emplprojPeriod, clgueprojPeriod);
          if (togetherWorkOnProject) {
            const projIndex = coupleInTeams.projects.findIndex(proj => proj.project === togetherWorkOnProject.project)
            if (projIndex >= 0)
              coupleInTeams.projects[projIndex].daysInProject += togetherWorkOnProject.daysInProject
            else
              coupleInTeams.projects.push({
                project: togetherWorkOnProject.project,
                daysInProject: togetherWorkOnProject.daysInProject
              })
            coupleInTeams.total += togetherWorkOnProject.daysInProject;
          }

        }
      if (coupleInTeams.total && coupleInTeams.total > pairDuration) {
        this.longestWorkInTeam = [coupleInTeams];
        pairDuration = coupleInTeams.total
      } else if (coupleInTeams.total && coupleInTeams.total === pairDuration)
        this.longestWorkInTeam.push(coupleInTeams)
    }
    this.processed = true;
  }

  checkTogetherWorkOnProject(emplprojPeriod: any[], clgueprojPeriod: any[]) {
    if (emplprojPeriod[1] != clgueprojPeriod[1])
      return null
    const prdStart = new Date(Math.max((new Date(emplprojPeriod[2])).getTime(), (new Date(clgueprojPeriod[2])).getTime()));
    const prdEnd = new Date(Math.min((new Date(emplprojPeriod[3])).getTime(), (new Date(clgueprojPeriod[3])).getTime()));
    const togetherWorkOnProject = Math.max((prdEnd.getTime() - prdStart.getTime()) / this._MS_PER_DAY, 0);
    if (togetherWorkOnProject) {
      return {
        project: emplprojPeriod[1],
        daysInProject: Math.round(togetherWorkOnProject)
      }
    } else
      return null
  }

  logResultInConsole() {
    if (this.longestWorkInTeam.length > 0) {
      console.log("Employee ID #1", " ", "Employee ID #2", " ", "Project ID", " ", "Days worked");
      console.log("");
      for (const pairOnProject of this.longestWorkInTeam)
        for (const project of pairOnProject.projects)
          console.log(`${pairOnProject.employee1}   ${pairOnProject.employee2}  ${project.project}   ${project.daysInProject}`)
    }
    else
      console.log(">Няма служители които са работили заедно по проекти!")
  }
}



