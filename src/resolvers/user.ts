import { Resolver, Query, Mutation, Field, Ctx, Arg, InputType, ObjectType } from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;
    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => [User], { nullable: true })
    user?: User[]
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse) // User creation
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username must contain at least 3 caracters"
                    },
                ],
            };
        }

        if (options.password.length <= 2) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Password must contain at least 2 caracters"
                    },
                ],
            };
        }

        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, {
            username: options.username, 
            password: hashedPassword, 
        });

        try {
            await em.persistAndFlush(user);    
        } catch(err) {
            if (err.code === "23505") {
                return {
                    errors: [{
                        field: 'username',
                        message: 'Username has already been taken',
                    }]
                }
            }
        }

        return { user };
    }

    // User login
    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username }); // User existence verification
        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'Oups... Could not find that username'
                    },
                ],

            }
        };

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect Password ! Make sure password match",
                    },
                ],
            };
        }

        // no errors
        return {
            user,
        };
    }
}