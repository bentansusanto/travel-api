import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { State } from './state.entity';

@Entity('countries')
export class Country {
  @PrimaryColumn()
  id: string;

  @Column()
  iso: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @OneToMany(() => State, (state) => state.country, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  states: State[];

  @OneToMany(() => BookTour, (bookTour) => bookTour.country, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  book_tours: BookTour[];

  @Column()
  flag: string;

  @Column()
  phone_code: string;

  @Column()
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
