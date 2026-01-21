import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country as CscCountry, State as CscState } from 'country-state-city';
import { Repository } from 'typeorm';
import { Country } from '../country/entities/country.entity';
import { State } from '../country/entities/state.entity';
import { CategoryDestination } from '../destination/entities/category_destination.entity';
import { Roles } from '../users/entities/role.entity';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryDestination)
    private readonly categoryDestinationRepository: Repository<CategoryDestination>,
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedCountryAndState();
    await this.seedCategoryDestination();
  }

  // seed roles
  async seedRoles() {
    const defaultRoles = [
      { name: 'Owner', code: 'owner', level: 100, self_register: true },
      { name: 'Developer', code: 'developer', level: 100, self_register: true },
      { name: 'Admin', code: 'admin', level: 80, self_register: false },
      { name: 'Guide', code: 'guide', level: 60, self_register: false },
      { name: 'Traveller', code: 'traveller', level: 10, self_register: true },
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await this.roleRepository.findOneBy({
        code: roleData.code,
      });

      if (!existingRole) {
        const newRole = this.roleRepository.create(roleData);
        await this.roleRepository.save(newRole);
        console.log(`Role ${roleData.name} created successfully.`);
      }
    }
  }

  // seed country & state
  async seedCountryAndState() {
    const allCountries = CscCountry.getAllCountries();

    // Daftar country yang ingin di-seed
    const countriesToSeed = ['ID', 'TR']; // Indonesia dan Turkey

    for (const countryCode of countriesToSeed) {
      await this.createCountryWithStates(allCountries, countryCode);
    }
  }

  // Helper method untuk membuat country dan state-nya
  private async createCountryWithStates(
    allCountries: any[],
    countryCode: string,
  ) {
    const countryData = allCountries.find((c) => c.isoCode === countryCode);

    if (!countryData) {
      console.log(
        `Country with code ${countryCode} not found in country-state-city plugin`,
      );
      return;
    }

    // Cek apakah country sudah ada di database
    let country = await this.countryRepository.findOne({
      where: { iso: countryData.isoCode },
    });

    if (!country) {
      // Buat country
      country = this.countryRepository.create({
        id: countryData.isoCode,
        iso: countryData.isoCode,
        name: countryData.name,
        flag: countryData.isoCode, // Gunakan ISO code instead of emoji untuk kompatibilitas
        phone_code: countryData.phonecode,
        currency: countryData.currency,
      });
      await this.countryRepository.save(country);
      console.log(`Country ${countryData.name} created successfully.`);

      // Ambil semua state/provinsi dari plugin country-state-city
      const states = CscState.getStatesOfCountry(countryData.isoCode) || [];

      if (states.length > 0) {
        // Buat semua state/provinsi secara otomatis
        const newStates = states.map((state) => {
          return this.stateRepository.create({
            id: state.isoCode,
            name: state.name,
            country: country,
            longitude: state.longitude || '0',
            latitude: state.latitude || '0',
          });
        });

        await this.stateRepository.save(newStates);
        console.log(
          `${newStates.length} states created successfully for ${countryData.name}.`,
        );
      }
    } else {
      console.log(`Country ${countryData.name} already exists.`);
    }
  }

  // seed category destination
  async seedCategoryDestination() {
    const defaultCategoryDestination = [
      { name: 'Religion', code: 'religion' },
      { name: 'Adventure', code: 'adventure' },
      { name: 'Culture', code: 'culture' },
      { name: 'Traveling', code: 'traveling' },
    ];

    for (const categoryDestinationData of defaultCategoryDestination) {
      const existingCategoryDestination =
        await this.categoryDestinationRepository.findOneBy({
          code: categoryDestinationData.code,
        });

      if (!existingCategoryDestination) {
        const newCategoryDestination =
          this.categoryDestinationRepository.create(categoryDestinationData);
        await this.categoryDestinationRepository.save(newCategoryDestination);
        console.log(
          `Category Destination ${categoryDestinationData.name} created successfully.`,
        );
      }
    }
  }
}
