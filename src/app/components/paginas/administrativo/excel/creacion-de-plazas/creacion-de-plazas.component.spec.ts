import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreacionDePlazasComponent } from './creacion-de-plazas.component';

describe('CreacionDePlazasComponent', () => {
  let component: CreacionDePlazasComponent;
  let fixture: ComponentFixture<CreacionDePlazasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreacionDePlazasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreacionDePlazasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
