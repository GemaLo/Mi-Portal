import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltasMasivasComponent } from './altas-masivas.component';

describe('AltasMasivasComponent', () => {
  let component: AltasMasivasComponent;
  let fixture: ComponentFixture<AltasMasivasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltasMasivasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltasMasivasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
