import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SistemasModulosComponent } from './sistemas-modulos.component';

describe('SistemasModulosComponent', () => {
  let component: SistemasModulosComponent;
  let fixture: ComponentFixture<SistemasModulosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SistemasModulosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SistemasModulosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
