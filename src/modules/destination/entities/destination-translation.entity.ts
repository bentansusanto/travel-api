import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Destination } from './destination.entity';

export enum Language {
  EN = 'en',
  ID = 'id',
}

@Entity('destination_translations')
export class DestinationTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Destination, (destination) => destination.translations)
  @JoinColumn({ name: 'destination_id' })
  destination: Destination;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: Language,
  })
  language_code: Language;

  @Column()
  thumbnail: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  image: string[];

  @Column({
    type: 'json',
    nullable: true,
  })
  detail_tour: string[];

  @Column({
    type: 'json',
    nullable: true,
  })
  facilities: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
