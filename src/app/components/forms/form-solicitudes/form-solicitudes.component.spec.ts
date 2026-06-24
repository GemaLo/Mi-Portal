import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSolicitudesComponent } from './form-solicitudes.component';

describe('FormSolicitudesComponent', () => {
  let component: FormSolicitudesComponent;
  let fixture: ComponentFixture<FormSolicitudesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSolicitudesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
