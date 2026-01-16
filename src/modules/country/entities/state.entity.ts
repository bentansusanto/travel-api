import { Destination } from 'src/modules/destination/entities/destination.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Country } from './country.entity';
import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';

@Entity('states')
export class State {
  @PrimaryColumn()
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @ManyToOne(() => Country, (country) => country.states, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => Destination, (destination) => destination.state)
  destinations: Destination[];

  @OneToMany(() => BookTour, (bookTour) => bookTour.state)
  bookTours: BookTour[];

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
