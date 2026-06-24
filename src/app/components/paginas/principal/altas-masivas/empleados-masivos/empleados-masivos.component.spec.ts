import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadosMasivosComponent } from './empleados-masivos.component';

describe('EmpleadosMasivosComponent', () => {
  let component: EmpleadosMasivosComponent;
  let fixture: ComponentFixture<EmpleadosMasivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadosMasivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpleadosMasivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
