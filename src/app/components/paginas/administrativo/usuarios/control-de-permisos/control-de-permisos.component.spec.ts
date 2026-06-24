import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlDePermisosComponent } from './control-de-permisos.component';

describe('ControlDePermisosComponent', () => {
  let component: ControlDePermisosComponent;
  let fixture: ComponentFixture<ControlDePermisosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlDePermisosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlDePermisosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
