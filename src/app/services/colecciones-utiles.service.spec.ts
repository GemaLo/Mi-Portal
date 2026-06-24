import { TestBed } from '@angular/core/testing';

import { ColeccionesUtilesService } from './colecciones-utiles.service';

describe('ColeccionesUtilesService', () => {
  let service: ColeccionesUtilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColeccionesUtilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
