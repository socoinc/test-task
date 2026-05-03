import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsSyncService } from '../analytics/analytics-sync.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { User, UserDocument } from './schemas/user.schema';

type CreateUserInput = {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly analyticsSyncService: AnalyticsSyncService,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: input.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
    });

    await this.analyticsSyncService.syncUser(user);

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updateProfile(userId: string, dto: UpdateMeDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: dto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.analyticsSyncService.syncUser(user);

    return user;
  }

  async deactivate(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.analyticsSyncService.syncUser(user);

    return user;
  }
}
